import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="space-y-6">
      <section className="card">
        <div className="section-header">
          <div>
            <div className="text-sm font-black tracking-[0.16em] text-cyan-200/80">ACCOUNT LOGIN</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">로그인</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 betlab-muted">
              아이디와 비밀번호를 입력해서 BetLab 계정으로 로그인한다.
            </p>
          </div>
          <span className="badge">ID / PASSWORD</span>
        </div>
      </section>

      <LoginForm />
    </main>
  );
}
