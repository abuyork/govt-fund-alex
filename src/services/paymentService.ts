import { supabase } from "./supabase";
import { fetchAPI } from "./api";

export type PaymentMethod = "card" | "bank" | "toss";
export type PlanType = "free" | "pro";

export interface PaymentDetails {
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardHolder?: string;
}

export interface PaymentRequest {
  userId: string;
  planType: PlanType;
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetails;
  amount: number;
}

export interface SubscriptionDetails {
  id: string;
  userId: string;
  planType: PlanType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  paymentId: string;
}

// Process a payment and create a subscription with Toss
export const processPayment = async (
  paymentData: PaymentRequest
): Promise<{
  success: boolean;
  paymentId?: string;
  tossPaymentURL?: string;
  error?: string;
}> => {
  try {
    // Create a payment record in Supabase
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: paymentData.userId,
        amount: paymentData.amount,
        status: "pending",
        payment_method: paymentData.paymentMethod,
      })
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    if (paymentData.paymentMethod === "toss") {
      // Prepare Toss payment request
      const tossPaymentParams = {
        amount: paymentData.amount,
        orderId: paymentRecord.id,
        orderName: `${paymentData.planType} 플랜 구독`,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: "User", // In a real app, get this from user profile
      };

      // Call API to get Toss payment URL
      try {
        console.log("working--1");

        const response = await fetchAPI<{
          success: boolean;
          paymentURL: string;
        }>("/api/payments/toss/request", {
          method: "POST",
          body: JSON.stringify(tossPaymentParams),
        });
        console.log("working--1");

        if (response.success) {
          return {
            success: true,
            paymentId: paymentRecord.id,
            tossPaymentURL: response.paymentURL,
          };
        } else {
          throw new Error("토스 결제 초기화에 실패했습니다.");
        }
      } catch (error) {
        throw new Error("토스 결제 연동 중 오류가 발생했습니다.");
      }
    } else {
      // Handle other payment methods
      let paymentSuccess = false;

      switch (paymentData.paymentMethod) {
        case "card":
          // For credit card payments, validate the card details
          if (
            !paymentData.paymentDetails?.cardNumber ||
            !paymentData.paymentDetails?.cardExpiry ||
            !paymentData.paymentDetails?.cardCvc
          ) {
            throw new Error("카드 정보가 올바르지 않습니다.");
          }

          // Call a payment gateway API here in production
          // This is a simulation for development
          paymentSuccess = true;
          break;

        case "bank":
          // Bank transfers need to be manually verified
          paymentSuccess = true; // Will be pending until admin verifies
          break;

        default:
          throw new Error("지원되지 않는 결제 방법입니다.");
      }

      if (paymentSuccess) {
        // Update payment status
        const status =
          paymentData.paymentMethod === "bank" ? "pending" : "completed";
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: status,
            ...(status === "completed"
              ? { payment_date: new Date().toISOString() }
              : {}),
          })
          .eq("id", paymentRecord.id);

        if (updateError) throw new Error(updateError.message);

        // If payment completed successfully, create subscription
        if (status === "completed") {
          await createSubscription(
            paymentData.userId,
            paymentData.planType,
            paymentRecord.id
          );
        }

        return {
          success: true,
          paymentId: paymentRecord.id,
        };
      } else {
        // Update payment as failed
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", paymentRecord.id);

        return {
          success: false,
          error: "결제 처리 중 오류가 발생했습니다.",
        };
      }
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "결제 처리 중 오류가 발생했습니다.",
    };
  }
};

// Verify Toss payment callback
export const verifyTossPayment = async (
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Call our backend to verify payment with Toss
    const response = await fetchAPI<{ success: boolean; error?: string }>(
      "payments/toss/verify",
      {
        method: "POST",
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    if (response.success) {
      // Get payment details from Supabase
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("user_id, amount, payment_method")
        .eq("id", orderId)
        .single();

      if (paymentError) throw new Error(paymentError.message);

      // Update payment status
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          payment_date: new Date().toISOString(),
          toss_payment_key: paymentKey,
        })
        .eq("id", orderId);

      if (updateError) throw new Error(updateError.message);

      // Determine plan type based on amount
      let planType: PlanType = "free";
      if (payment.amount === 9900) {
        planType = "pro";
      }

      // Create subscription
      await createSubscription(payment.user_id, planType, orderId);

      return { success: true };
    } else {
      // Update payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", orderId);

      return {
        success: false,
        error: response.error || "결제 확인 중 오류가 발생했습니다.",
      };
    }
  } catch (error) {
    console.error("Toss payment verification error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "결제 확인 중 오류가 발생했습니다.",
    };
  }
};

// Create a user subscription after successful payment
export const createSubscription = async (
  userId: string,
  planType: PlanType,
  paymentId: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> => {
  try {
    // Calculate subscription period (1 month from now)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create subscription record
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_type: planType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        auto_renew: true,
        payment_id: paymentId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update user's plan type
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ plan_type: planType })
      .eq("id", userId);

    if (userUpdateError) throw new Error(userUpdateError.message);

    // Initialize the user's usage data based on the new plan
    const usageInitialized = await updateUserUsageOnPlanChange(
      userId,
      planType
    );
    if (!usageInitialized) {
      console.warn("Failed to initialize usage data for user:", userId);
    }

    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error("Subscription creation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "구독 생성 중 오류가 발생했습니다.",
    };
  }
};

// Get active subscription for a user
export const getUserSubscription = async (
  userId: string
): Promise<SubscriptionDetails | null> => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no active subscription found
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      planType: data.plan_type,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      autoRenew: data.auto_renew,
      paymentId: data.payment_id,
    };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
};

// Cancel a subscription
export const cancelSubscription = async (
  subscriptionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Update subscription record
    const { error } = await supabase
      .from("subscriptions")
      .update({
        is_active: false,
        auto_renew: false,
      })
      .eq("id", subscriptionId)
      .eq("user_id", userId); // Ensure user owns this subscription

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "구독 취소 중 오류가 발생했습니다.",
    };
  }
};

// Get plan information
export const getPlans = () => {
  return {
    free: {
      name: "무료 플랜",
      price: 0,
      features: [
        "기본 지원사업 검색",
        "알림 서비스 1년 무료",
        "AI 사업계획서 1회 무료 생성",
        "기본 템플릿 무료 이용",
      ],
    },
    pro: {
      name: "프로 플랜",
      price: 9900,
      features: [
        "고급 지원사업 검색 및 필터링",
        "알림 서비스 무제한",
        "AI 사업계획서 무제한 생성",
        "특화 템플릿 3개 무료 이용",
        "사업계획서 PDF/DOCX 변환",
      ],
    },
  };
};

// User usage data interface
export interface UsageData {
  ai_business_plans_remaining: number;
  specialized_templates_remaining: number;
  expert_consulting_remaining: number;
  last_updated: string;
}

// Initialize usage data for a new user
export const initializeUserUsage = async (
  userId: string,
  planType: PlanType
): Promise<boolean> => {
  try {
    let usageData: UsageData = {
      ai_business_plans_remaining: 1, // Default for free plan
      specialized_templates_remaining: 0, // Default for free plan
      expert_consulting_remaining: 0, // Default for free plan
      last_updated: new Date().toISOString(),
    };

    // Set usage limits based on plan
    if (planType === "pro") {
      usageData = {
        ...usageData,
        ai_business_plans_remaining: -1, // -1 means unlimited
        specialized_templates_remaining: 3, // Pro plan gets 3 specialized templates
      };
    }

    // Update user's usage data in Supabase
    const { error } = await supabase
      .from("users")
      .update({ usage_data: usageData })
      .eq("id", userId);

    if (error) {
      console.error("Error initializing user usage data:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in initializeUserUsage:", error);
    return false;
  }
};

// Update user's usage data when upgrading plan
export const updateUserUsageOnPlanChange = async (
  userId: string,
  newPlanType: PlanType
): Promise<boolean> => {
  try {
    // First get current usage data
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("usage_data")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching user data:", fetchError);
      return false;
    }

    const currentUsage = userData.usage_data || {
      ai_business_plans_remaining: 0,
      specialized_templates_remaining: 0,
      expert_consulting_remaining: 0,
      last_updated: new Date().toISOString(),
    };

    let updatedUsage: UsageData = {
      ...currentUsage,
      last_updated: new Date().toISOString(),
    };

    // Update based on new plan type
    if (newPlanType === "pro") {
      updatedUsage = {
        ...updatedUsage,
        ai_business_plans_remaining: -1, // Unlimited
        specialized_templates_remaining: Math.max(
          currentUsage.specialized_templates_remaining,
          3
        ),
      };
    }

    // Update in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ usage_data: updatedUsage })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user usage data:", updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateUserUsageOnPlanChange:", error);
    return false;
  }
};

// Get user's current usage data
export const getUserUsageData = async (
  userId: string
): Promise<UsageData | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("usage_data")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user usage data:", error);
      return null;
    }

    return data.usage_data;
  } catch (error) {
    console.error("Error in getUserUsageData:", error);
    return null;
  }
};

// Decrement usage count for a specific feature
export const decrementUsage = async (
  userId: string,
  feature: "ai_business_plans" | "specialized_templates" | "expert_consulting"
): Promise<boolean> => {
  try {
    // Get current usage
    const userData = await getUserUsageData(userId);
    if (!userData) return false;

    // Check if feature has a count to decrement (not unlimited)
    const featureKey = `${feature}_remaining` as keyof UsageData;
    const currentCount = userData[featureKey] as number;

    // If unlimited (-1) or already at 0, don't decrement
    if (currentCount === -1 || currentCount <= 0) {
      return true; // Operation is technically successful
    }

    // Create updated usage data
    const updatedUsage: UsageData = {
      ...userData,
      [featureKey]: currentCount - 1,
      last_updated: new Date().toISOString(),
    };

    // Update in database
    const { error } = await supabase
      .from("users")
      .update({ usage_data: updatedUsage })
      .eq("id", userId);

    if (error) {
      console.error(`Error decrementing ${feature} usage:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in decrementUsage for ${feature}:`, error);
    return false;
  }
};
