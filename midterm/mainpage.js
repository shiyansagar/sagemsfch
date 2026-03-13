gsap.registerPlugin(ScrollTrigger);

gsap.to("#page2 h1", {
    transform: "translate(-400%)",
    scrollTrigger: {
        trigger: "#page2",
        // markers: "true",
        scroller: "body",
        start: "top 0%",
        end: "top -250%",
        scrub: 2,
        pin: true
    }
})
