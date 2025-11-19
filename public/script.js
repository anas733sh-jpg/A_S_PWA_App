/* ----------------------------- */
/*        الأصوات                */
/* ----------------------------- */
const clickSound = new Audio("/uploads/click.mp3");
const successSound = new Audio("/uploads/success.mp3");
const errorSound = new Audio("/uploads/error.mp3");

/* ----------------------------- */
/*        قلوب 3D عشوائية        */
/* ----------------------------- */
function createHearts() {
    const container = document.querySelector(".hearts-container");
    setInterval(() => {
        const heart = document.createElement("div");
        heart.classList.add("heart");

        // موقع عشوائي
        heart.style.left = Math.random() * 100 + "%";

        // سرعة عشوائية
        heart.style.animationDuration = (4 + Math.random() * 4) + "s";

        container.appendChild(heart);

        // إزالة القلب بعد انتهاء الحركة
        setTimeout(() => heart.remove(), 7000);
    }, 500);
}

createHearts();

/* ----------------------------- */
/*       تسجيل الدخول            */
/* ----------------------------- */
document.getElementById("loginBtn").addEventListener("click", () => {
    clickSound.play();

    const password = document.getElementById("password").value.trim();

    if (password === "anas") {
        successSound.play();

        // تأخير بسيط لأن الصوت يشتغل
        setTimeout(() => {
            window.location.href = "games.html";
        }, 600);

    } else {
        errorSound.play();

        // اهتزاز الصندوق
        const box = document.querySelector(".login-box");
        box.style.animation = "shake 0.3s";

        setTimeout(() => box.style.animation = "", 300);
    }
});

/* ----------------------------- */
/*   أنيميشن اهتزاز الخطأ        */
/* ----------------------------- */
const style = document.createElement("style");
style.innerHTML = `
@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-6px); }
    100% { transform: translateX(0); }
}
`;
document.head.appendChild(style);