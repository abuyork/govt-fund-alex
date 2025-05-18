import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto px-6 py-12 space-y-10">
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>

        {/* ───────────────────────── 제1조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제1조(목적)</h2>
          <p className="text-gray-700">
            크리피 솔루션즈(이하 ‘회사'라고 함)는 회사가 제공하고자 하는 서비스(이하 ‘회사
            서비스’)를 이용하는 개인(이하 ‘이용자’ 또는 ‘개인’)의 정보(이하 ‘개인정보’)를
            보호하기 위해, 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률
            등 관련 법령을 준수하고, 서비스 이용자의 개인정보 보호 관련한 고충을 신속하고
            원활하게 처리할 수 있도록 하기 위하여 본 개인정보처리방침(이하 ‘본 방침’)을
            수립합니다.
          </p>
        </section>

        {/* ───────────────────────── 제2조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제2조(개인정보 처리의 원칙)</h2>
          <p className="text-gray-700">
            회사는 개인정보 관련 법령 및 본 방침에 따라 이용자의 개인정보를 수집할 수
            있으며, 수집된 개인정보는 개인의 동의가 있는 경우에 한해 제3자에게 제공될 수
            있습니다. 단, 법령의 규정 등에 의해 적법하게 강제되는 경우 회사는 수집한
            이용자의 개인정보를 사전에 개인의 동의 없이 제3자에게 제공할 수도 있습니다.
          </p>
        </section>

        {/* ───────────────────────── 제3조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제3조(회원 가입을 위한 정보)</h2>
          <p className="text-gray-700">
            회사는 이용자의 회사 서비스 회원가입을 위하여 다음과 같은 정보를 수집합니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>필수 수집 정보: 이메일 주소, 비밀번호, 이름, 닉네임, 생년월일, 휴대폰 번호</li>
          </ul>
        </section>

        {/* ───────────────────────── 제4조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제4조(본인 인증을 위한 정보)</h2>
          <p className="text-gray-700">본인인증을 위하여 다음과 같은 정보를 수집합니다.</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              필수 수집 정보: 휴대폰 번호, 이메일 주소, 이름, 생년월일, 성별, 본인확인값(CI,
              DI), 이동통신사, 아이핀 정보(아이핀 확인 시), 내/외국인 여부
            </li>
          </ul>
        </section>

        {/* ───────────────────────── 제5조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제5조(법정대리인 동의를 위한 정보)</h2>
          <p className="text-gray-700">
            법정대리인의 동의가 필요한 경우 다음과 같은 정보를 수집합니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              필수 수집 정보: 보호자 이름, 생년월일, 성별, 내/외국인 여부, 보호자 휴대폰
              번호, 이동통신사, 아이핀 정보(아이핀 확인 시), 보호자 본인확인값(CI, DI),
              본인과의 관계
            </li>
          </ul>
        </section>

        {/* ───────────────────────── 제6조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제6조(결제 서비스를 위한 정보)</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              필수 수집 정보: 카드번호, 카드비밀번호, 유효기간, 생년월일 6자리(yy/mm/dd),
              은행명, 계좌번호
            </li>
          </ul>
        </section>

        {/* ───────────────────────── 제7조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제7조(현금 영수증 발행을 위한 정보)</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              필수 수집 정보: 현금영수증 발행 대상자 이름, 생년월일, 주소, 휴대폰 번호,
              현금영수증 카드번호
            </li>
          </ul>
        </section>

        {/* ───────────────────────── 제8조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제8조(회사 서비스 제공을 위한 정보)</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>필수 수집 정보: 아이디, 이메일 주소, 이름, 생년월일, 연락처</li>
          </ul>
        </section>

        {/* ───────────────────────── 제9조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">
            제9조(서비스 이용 및 부정 이용 확인을 위한 정보)
          </h2>
          <p className="text-gray-700">
            서비스 이용 통계·분석 및 부정이용 확인·분석을 위해 다음 정보를 수집합니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>서비스 이용기록, 쿠키, 접속지 정보, 기기정보</li>
          </ul>
          <p className="text-gray-700">
            또한 회사가 발송한 이메일/고객센터/게시판 등을 통한 개인정보 입력 과정에서
            수집될 수 있습니다.
          </p>
          <p className="text-gray-700">
            ― 신규 서비스 개발, 이벤트·행사 안내, 이용 기록 분석, 이용자 간 관계 형성 등도
            목적에 포함됩니다.
          </p>
        </section>

        {/* ───────────────────────── 제10조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제10조(광고성 정보의 전송 조치)</h2>
          <p className="text-gray-700">
            회사는 전자적 전송매체로 영리 목적의 광고성 정보를 전송할 때 사전 동의를
            원칙으로 하며, 예외·거부·철회 절차 및 야간(21:00~08:00) 전송 시 별도 동의
            획득, 발송 정보 표기 의무 등을 준수합니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>회사명 및 연락처, 수신 거부·동의 철회 방법 명시</li>
            <li>
              수신거부 방해, 무작위 연락처 생성, 신원·출처 은폐, 기망성 회신 유도 등
              금지조치 준수
            </li>
          </ul>
        </section>

        {/* ───────────────────────── 제11조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">
            제11조(개인정보 조회 및 수집동의 철회)
          </h2>
          <p className="text-gray-700">
            이용자 및 법정대리인은 언제든 개인정보를 조회·수정하거나 수집 동의를 철회할
            수 있습니다. 서면·전화·이메일로 요청 시 즉시 처리합니다.
          </p>
        </section>

        {/* ───────────────────────── 제12조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제12조(개인정보 정보변경 등)</h2>
          <p className="text-gray-700">
            오류 정정 요청 시 정정 완료 전까지 해당 개인정보 이용·제공을 중단하며, 이미
            제3자에게 제공된 경우 지체 없이 통지하여 정정이 이뤄지도록 합니다.
          </p>
        </section>

        {/* ───────────────────────── 제13조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제13조(이용자의 의무)</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>정확한 정보 유지 책임</li>
            <li>타인 정보 도용 시 자격 상실·법적 제재</li>
            <li>전자우편주소·비밀번호 등의 보안 유지 및 양도·대여 금지</li>
          </ul>
        </section>

        {/* ───────────────────────── 제14조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">
            제14조(개인정보 유출 등에 대한 조치)
          </h2>
          <p className="text-gray-700">
            유출 사실 인지 시 즉시 이용자 통지 및 방송통신위원회·KISA 신고를 포함하여
            법령이 정한 모든 사항을 알립니다.
          </p>
        </section>

        {/* ───────────────────────── 제15조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">제15조(유출 통지의 예외)</h2>
          <p className="text-gray-700">
            연락처를 알 수 없는 등 정당한 사유가 있을 경우, 홈페이지 30일 이상 게시로
            갈음할 수 있습니다.
          </p>
        </section>

        {/* ───────────────────────── 제16조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">
            제16조(국외 이전 개인정보의 보호)
          </h2>
          <p className="text-gray-700">
            국제계약 체결 시 위법 사항을 포함하지 않으며, 국외 이전 시 사전 고지·동의 및
            법령이 정한 보호조치를 이행합니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>이전 개인정보 항목, 국가·일시·방법, 수령자 정보, 이용목적·보유기간 고지</li>
          </ul>
        </section>

        {/* ───────────────────────── 제17조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4">
          <h2 className="text-xl font-semibold">
            제17조(회사의 개인정보 보호 책임자 지정)
          </h2>
          <p className="text-gray-700">
            개인정보 보호 책임자: 박강 (OM) / 010-4832-1667 / Kang@crypee.io
          </p>
        </section>

        {/* ───────────────────────── 제18조 ───────────────────────── */}
        <section className="max-w-4xl space-y-4 pb-2">
          <h2 className="text-xl font-semibold">제18조(권익침해에 대한 구제방법)</h2>
          <p className="text-gray-700">
            개인정보 분쟁조정위원회(1833-6972), 개인정보침해신고센터(118), 대검찰청(1301),
            경찰청(182) 등에 분쟁해결 및 상담을 신청할 수 있습니다.
          </p>
          <p className="text-gray-700">
            또한 개인정보 열람·정정·삭제·처리정지 요구에 대한 공공기관 처분에 불복할 경우
            &lt;중앙행정심판위원회 110 / www.simpan.go.kr&gt;에 행정심판 청구가 가능합니다.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;