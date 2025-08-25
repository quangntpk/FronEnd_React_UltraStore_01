import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { RoughEase } from 'gsap/EasePack';
import '@/components/layout/gapthu/GapThuUser.css';

// Register GSAP plugins
gsap.registerPlugin(RoughEase);

interface Prize {
  image: string;
  title: string;
}

interface Ball {
  dom: HTMLElement;
  x: number;
  y: number;
  rotate: number;
  size: number;
}

interface ConfettiConfig {
  count?: number;
  x?: number;
  y?: number;
  randX?: number;
  randY?: number;
  speedX?: number;
  speedY?: number;
  speedRandX?: number;
  speedRandY?: number;
  gravity?: number;
  size?: number;
  sizeRand?: number;
}

const GachaMachine: React.FC = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLImageElement>(null);
  const ballsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const prizeImgRef = useRef<HTMLImageElement>(null);

  // Use refs to store current values to avoid dependency issues
  const ballsArrayRef = useRef<Ball[]>([]);
  const prizeBallRef = useRef<Ball | null>(null);
  const startedRef = useRef(false);
  const prizeRef = useRef<Prize | null>(null);
  const jittersRef = useRef<gsap.core.Timeline[]>([]);
  const prizeShownRef = useRef(false);

  const [initialized, setInitialized] = useState(false);
  const [showPlayAgain, setShowPlayAgain] = useState(false);
  // Thêm biến để kiểm soát khi nào hiển thị prize result (con gấu)
  const [showPrizeResult, setShowPrizeResult] = useState(false);

  const SPEED = 1;
  const TITLE = 'がんばれ!';
  const PRICE = '100円';

  const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

  const confetti = (
    parent: HTMLElement,
    {
      count = 100,
      x = 50,
      y = 50,
      randX = 10,
      randY = 10,
      speedX = 0,
      speedY = -2,
      speedRandX = 0.5,
      speedRandY = 0.5,
      gravity = 0.01,
      size = 10,
      sizeRand = 5
    }: ConfettiConfig = {}
  ) => {
    const container = document.createElement('div');
    container.classList.add('gacha-confetti');

    const particles: Array<{
      dom: HTMLElement;
      x: number;
      y: number;
      speedX: number;
      speedY: number;
      size: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');

      const settings = {
        dom: particle,
        x: x + Math.random() * randX * 2 - randX,
        y: y + Math.random() * randY * 2 - randY,
        speedX: speedX + Math.random() * speedRandX * 2 - speedRandX,
        speedY: speedY + Math.random() * speedRandY * 2 - speedRandY,
        size: size + Math.random() * sizeRand * 2 - sizeRand
      };

      particle.style.backgroundColor = `hsl(${Math.random() * 360}deg, 80%, 60%)`;
      particle.style.setProperty('--rx', (Math.random() * 2 - 1).toString());
      particle.style.setProperty('--ry', (Math.random() * 2 - 1).toString());
      particle.style.setProperty('--rz', (Math.random() * 2 - 1).toString());
      particle.style.setProperty('--rs', (Math.random() * 2 + 0.5).toString());
      particles.push(settings);
      container.appendChild(particle);
    }

    const update = () => {
      particles.forEach((config, i) => {
        if (config.y > 100) {
          particles.splice(i, 1);
          config.dom.remove();
        }

        config.dom.style.setProperty('--size', config.size.toString());
        config.dom.style.left = config.x + '%';
        config.dom.style.top = config.y + '%';
        config.x += config.speedX;
        config.y += config.speedY;
        config.speedY += gravity;
      });

      if (particles.length) {
        requestAnimationFrame(update);
      } else {
        container.remove();
      }
    };

    update();
    parent.insertAdjacentElement('beforeend', container);
  };

  const addAnimClass = (element: string | HTMLElement, clazz: string) => {
    const func = (el: HTMLElement) => {
      el.classList.add(clazz);
      el.setAttribute('data-animate', '');
    };

    if (typeof element === 'string') {
      [...document.querySelectorAll(element)].forEach(func);
    } else {
      func(element);
    }
  };

  const getPrize = async (): Promise<Prize> => {
    const prizes: Prize[] = [
      {
        image: 'https://assets.codepen.io/2509128/prize1.png',
        title: 'Bunny'
      },
      {
        image: 'https://assets.codepen.io/2509128/prize2.png',
        title: 'Teddy Bear'
      },
      {
        image: 'https://assets.codepen.io/2509128/prize3.png',
        title: 'Polar Bear'
      },
      {
        image: 'https://assets.codepen.io/2509128/prize4.png',
        title: 'Polar Bear Bride'
      }
    ];

    return prizes[~~(prizes.length * Math.random())];
  };

  const createBalls = () => {
    if (!ballsRef.current) return;

    // Clear existing balls
    ballsRef.current.innerHTML = '';
    ballsArrayRef.current = [];

    let id = 0;
    const newBalls: Ball[] = [];

    const createBall = (
      x: number,
      y: number,
      rotate: number = ~~(Math.random() * 360),
      hue: number = ~~(Math.random() * 360)
    ): Ball => {
      const size = 8;
      const ballElement = document.createElement('figure');
      ballElement.classList.add('gacha-ball');
      ballElement.setAttribute('data-id', (++id).toString());
      ballElement.style.setProperty('--size', `${size}vh`);
      ballElement.style.setProperty('--color1', `hsl(${hue}deg, 80%, 70%)`);
      ballElement.style.setProperty('--color2', `hsl(${hue + 20}deg, 50%, 90%)`);
      ballElement.style.setProperty('--outline', `hsl(${hue}deg, 50%, 55%)`);

      ballsRef.current?.appendChild(ballElement);

      let ballX = x;
      let ballY = y;
      let ballRotate = rotate;

      const update = () => {
        gsap.set(ballElement, {
          css: {
            left: `calc(${ballX} * (100% - ${size}vh))`,
            top: `calc(${ballY} * (100% - ${size}vh))`,
            transform: `rotate(${ballRotate}deg)`
          },
        });
      };

      const ball: Ball = {
        dom: ballElement,
        get x() { return ballX; },
        get y() { return ballY; },
        get rotate() { return ballRotate; },
        set x(value: number) { ballX = value; update(); },
        set y(value: number) { ballY = value; update(); },
        set rotate(value: number) { ballRotate = value; update(); },
        get size() { return size; }
      };

      newBalls.push(ball);
      update();
      return ball;
    };

    // Create all balls
    createBall(0.5, 0.6);
    createBall(0, 0.68);
    createBall(0.22, 0.65);
    createBall(0.7, 0.63);
    createBall(0.96, 0.66);

    createBall(0.75, 0.79);
    createBall(0.5, 0.8);
    const prizeB = createBall(0.9, 0.81);
    createBall(0, 0.82);

    createBall(1, 0.9);
    createBall(0.25, 0.85);

    createBall(0.9, 1);
    createBall(0.4, 1);
    createBall(0.65, 1);
    createBall(0.09, 1);

    ballsArrayRef.current = newBalls;
    prizeBallRef.current = prizeB;
  };

  const jitter = () => {
    // Clear existing jitters first
    jittersRef.current.forEach(j => j.kill());
    jittersRef.current = [];

    const newJitters: gsap.core.Timeline[] = [];

    ballsArrayRef.current.forEach(({ dom, rotate }, i) => {
      const tl = gsap.timeline({ repeat: -1, delay: -i * 0.0613 });

      gsap.set(dom, {
        y: 0,
        rotateZ: rotate,
      });

      const duration = Math.random() * 0.1 + 0.05;

      tl.to(dom, {
        y: -(Math.random() * 6 + 2),
        rotateZ: rotate,
        duration,
        ease: RoughEase.ease.config({
          template: "power0.out",
          strength: 1,
          points: 20,
          taper: "none",
          randomize: true,
          clamp: false
        })
      }).to(dom, {
        y: 0,
        rotateZ: rotate - Math.random() * 10 - 5,
        duration,
      });

      newJitters.push(tl);
    });

    const tl = gsap.timeline({ repeat: -1 });
    tl.to('.gacha-machine-container', {
      x: 2,
      duration: 0.1
    }).to('.gacha-machine-container', {
      x: 0,
      duration: 0.1
    });

    newJitters.push(tl);
    jittersRef.current = newJitters;

    console.log('Jittering started with', newJitters.length, 'timelines');
  };

  const stopJittering = async () => {
    console.log('Stopping jittering...');

    // Kill all jitter timelines
    jittersRef.current.forEach(jitter => {
      jitter.kill();
    });
    jittersRef.current = [];

    // Reset all balls to their original positions
    ballsArrayRef.current.forEach(({ dom, rotate }) => {
      gsap.to(dom, {
        y: 0,
        rotate,
        duration: 0.1
      });
    });

    // Reset machine position
    gsap.to('.gacha-machine-container', {
      x: 0,
      duration: 0.1
    });

    await delay(200);
    console.log('Jittering stopped');
  };

  const showHint = () => {
    if (!titleRef.current || !pointerRef.current) return;

    gsap.set(pointerRef.current, { opacity: 0 });

    gsap.to(titleRef.current, {
      y: '80vh',
      duration: 1,
      ease: 'back.out'
    });

    gsap.to(pointerRef.current, {
      opacity: 1,
      duration: 1,
      ease: 'none'
    });
  };

  const hideHint = () => {
    if (!titleRef.current || !pointerRef.current) return;

    gsap.to(titleRef.current, {
      y: '120vh',
      duration: 0.6
    });

    gsap.to(pointerRef.current, {
      opacity: 0,
      duration: 1
    });
  };

  const showHint2 = () => {
    if (!titleRef.current || !pointerRef.current || !titleContainerRef.current) return;

    const h2Element = titleContainerRef.current.querySelector('h2');
    if (h2Element) {
      h2Element.innerHTML = 'Tap to claim it!';
    }

    gsap.set(pointerRef.current, {
      x: '16vh',
      y: '3vh'
    });

    gsap.to(titleRef.current, {
      y: '80vh',
      duration: 1,
      ease: 'back.out'
    });

    gsap.to(pointerRef.current, {
      opacity: 1,
      duration: 1,
      ease: 'none'
    });
  };

  const pop = () => {
    if (!appRef.current || !prizeBallRef.current || !prizeRef.current || !titleRef.current) {
      console.error('Missing required refs in pop');
      return;
    }

    console.log('NEW Pop function called');
    prizeShownRef.current = true;

    // Set showPrizeResult thành true để hiển thị con gấu
    setShowPrizeResult(true);

    confetti(appRef.current, {
      speedY: 0,
      speedRandY: 1,
      speedRandX: 0.75,
      gravity: 0.02,
      y: 50,
      randX: 6,
      randY: 6,
      size: 8,
      sizeRand: 4,
      count: 128
    });

    gsap.set('.gacha-prize-reward-container', { opacity: 0, zIndex: 1000 });
    gsap.set('.gacha-prize-reward-container .gacha-prize', { scale: 0 });

    gsap.to('.gacha-prize-reward-container', {
      opacity: 1,
      duration: 0.3
    });

    gsap.to('.gacha-prize-reward-container .gacha-prize', {
      scale: 1,
      duration: 0.5,
      ease: 'back.out'
    });

    gsap.to(prizeBallRef.current.dom, {
      opacity: 0
    });

    // Make sure title is visible and has proper z-index
    gsap.set(titleRef.current, {
      y: '-50vh',
      zIndex: 10001,
    });

    const h2Element = titleContainerRef.current?.querySelector('h2');
    if (h2Element) {
      h2Element.innerHTML = `You got a<br>${prizeRef.current.title}!`;
      h2Element.style.zIndex = '10001';
      h2Element.style.position = 'relative';
    }

    // Animate title to visible position
    gsap.to(titleRef.current, {
      delay: 1,
      y: '5vh',
      duration: 0.6,
      zIndex: 10001,
      onComplete: () => {
        console.log('NEW Title animation completed');
        // Hiển thị Play Again sau khi title animation hoàn thành
        setTimeout(() => {
          console.log('NEW About to show play again button');
          setShowPlayAgain(true);
        }, 2000);
      }
    });

    // Hide machine after animation nhưng KHÔNG ẩn hoàn toàn để giữ background
    if (machineRef.current) {
      gsap.to(machineRef.current, {
        opacity: 0.3, // Chỉ làm mờ thay vì ẩn hoàn toàn
        duration: 1,
        delay: 1
      });
    }
  };

  const pickup = () => {
    if (!prizeBallRef.current || !appRef.current || !titleRef.current) {
      console.error('Missing required refs:', {
        prizeBall: !!prizeBallRef.current,
        app: !!appRef.current,
        title: !!titleRef.current
      });
      return;
    }

    console.log('Pickup function called');

    // Get the current position relative to the machine container instead of viewport
    const ballRect = prizeBallRef.current.dom.getBoundingClientRect();
    const appRect = appRef.current.getBoundingClientRect();

    if (!ballRect.width || !appRect.width) {
      console.error('Invalid bounding rect:', { ballRect, appRect });
      return;
    }

    // Calculate relative position within the gacha app
    const relativeX = (ballRect.left - appRect.left) / appRect.width * 100;
    const relativeY = (ballRect.top - appRect.top) / appRect.height * 100;

    console.log('Ball position:', { relativeX, relativeY });

    const prizeBallContainer = document.querySelector('.gacha-prize-ball-container');
    if (!prizeBallContainer) {
      console.error('Prize ball container not found');
      return;
    }

    if (prizeBallRef.current.dom.parentElement !== prizeBallContainer) {
      prizeBallContainer.appendChild(prizeBallRef.current.dom);
    }

    addAnimClass('.gacha-game-layer', 'gacha-dim');

    // Set initial position using the calculated relative position
    gsap.set(prizeBallRef.current.dom, {
      position: 'absolute',
      left: `${relativeX}%`,
      top: `${relativeY}%`,
      transform: `rotate(${prizeBallRef.current.rotate}deg)`,
      x: 0,
      y: 0
    });

    let tl = gsap.timeline();
    tl.to(prizeBallRef.current.dom, {
      left: '50%',
      top: '50%',
      scale: 2,
      rotate: -180,
      duration: 1,
      ease: 'power1.out'
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      scaleX: 2.1,
      ease: 'power1.inOut',
      scaleY: 1.9
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.inOut',
      scaleX: 1.9,
      scaleY: 2.1
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.inOut',
      scaleX: 2.1,
      scaleY: 1.9
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.inOut',
      scaleX: 1.9,
      scaleY: 2.1
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.inOut',
      scaleX: 2.1,
      scaleY: 1.9
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.inOut',
      scaleX: 1.9,
      scaleY: 2.1
    }).to(prizeBallRef.current.dom, {
      duration: 0.5,
      ease: 'power1.out',
      scaleX: 2.6,
      scaleY: 1.6
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.out',
      scaleX: 1.6,
      scaleY: 2.4,
      onComplete: pop
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.out',
      scaleX: 2.1,
      scaleY: 1.9,
    }).to(prizeBallRef.current.dom, {
      duration: 0.1,
      ease: 'power1.out',
      scaleX: 2,
      scaleY: 2
    });
  };

  const start = async () => {
    console.log('Start function called');
    if (!handleRef.current) {
      console.log('Handle ref not found');
      return;
    }

    handleRef.current.style.cursor = 'default';
    startedRef.current = true;
    hideHint();

    if (!prizeBallRef.current || ballsArrayRef.current.length === 0) {
      console.log('Balls not ready yet');
      return;
    }

    console.log('Starting handle animation...');
    await new Promise<void>(resolve => {
      const tl = gsap.timeline();
      tl.to(handleRef.current, {
        rotate: 90,
        duration: 0.3,
        ease: 'power1.in',
        onComplete: async () => {
          console.log('Handle rotated, starting jitter...');
          jitter();
          await delay(2000 * SPEED);
          console.log('Jitter time completed, stopping jitter...');
          await stopJittering();
          console.log('Jitter stopped, resolving...');
          resolve();
        }
      }).to(handleRef.current, {
        rotate: 0,
        duration: 1,
      });
    });

    console.log('Starting ball drop animation...');
    await new Promise<void>(resolve => {
      if (!prizeBallRef.current) {
        resolve();
        return;
      }

      const currentPrizeBall = prizeBallRef.current;
      const tl = gsap.timeline();
      gsap.to(currentPrizeBall.dom, {
        x: '-3vh',
        ease: 'none',
        duration: 0.5,
        rotate: currentPrizeBall.rotate + 10
      });

      if (ballsArrayRef.current.length >= 6) {
        gsap.to(ballsArrayRef.current[3].dom, {
          x: '1vh',
          y: '1vh',
          ease: 'none',
          duration: 0.5,
          rotate: ballsArrayRef.current[3].rotate - 5
        });
        gsap.to(ballsArrayRef.current[4].dom, {
          x: '-1vh',
          y: '1vh',
          ease: 'none',
          duration: 0.5,
          rotate: ballsArrayRef.current[4].rotate - 5
        });
        gsap.to(ballsArrayRef.current[5].dom, {
          x: '1vh',
          y: '1vh',
          ease: 'none',
          duration: 0.5,
          rotate: ballsArrayRef.current[5].rotate - 5
        });
      }

      tl.to(currentPrizeBall.dom, {
        y: '12vh',
        ease: 'power1.in',
        duration: 0.5
      }).to(currentPrizeBall.dom, {
        y: '23vh',
        ease: 'power1.in',
        duration: 0.5
      }).to(currentPrizeBall.dom, {
        y: '22vh',
        ease: 'power1.out',
        duration: 0.2
      }).to(currentPrizeBall.dom, {
        y: '23vh',
        ease: 'power1.in',
        duration: 0.2
      }).to(currentPrizeBall.dom, {
        y: '22.5vh',
        ease: 'power1.out',
        duration: 0.1
      }).to(currentPrizeBall.dom, {
        y: '23vh',
        ease: 'power1.in',
        duration: 0.1,
        onComplete: () => {
          console.log('Ball drop completed');
          resolve();
        }
      });
    });

    console.log('Setting up prize ball click handler...');
    if (prizeBallRef.current) {
      const currentPrizeBall = prizeBallRef.current;
      currentPrizeBall.dom.style.cursor = 'pointer';
      currentPrizeBall.dom.style.pointerEvents = 'auto';
      currentPrizeBall.dom.style.zIndex = '999';

      let shouldShowHint = true;

      const handlePrizeBallClick = (event: Event) => {
        event.stopPropagation();
        event.preventDefault();
        console.log('Prize ball clicked!');

        // Vô hiệu hóa ngay lập tức để ngăn click nhiều lần
        currentPrizeBall.dom.style.pointerEvents = 'none';
        currentPrizeBall.dom.style.cursor = 'default';
        shouldShowHint = false;
        hideHint();
        pickup();
      };

      // Xóa mọi sự kiện click trước đó để tránh trùng lặp
      currentPrizeBall.dom.removeEventListener('click', handlePrizeBallClick);
      currentPrizeBall.dom.addEventListener('click', handlePrizeBallClick, { once: true });

      setTimeout(() => {
        if (shouldShowHint) {
          console.log('Showing hint 2...');
          showHint2();
        }
      }, 2000);
    }
  };

  const prepare = () => {
    if (!machineRef.current || !handleRef.current) return;

    const tl = gsap.timeline();

    tl.to(machineRef.current, {
      y: '0vh',
      ease: 'none',
      duration: 0.6,
      onComplete() {
        if (handleRef.current) {
          handleRef.current.style.cursor = 'pointer';

          const handleClick = (event: Event) => {
            console.log('Handle clicked!');
            event.stopPropagation();
            start();
          };

          handleRef.current.addEventListener('click', handleClick, { once: true });
        }

        ballsArrayRef.current.forEach(ball => {
          const tl = gsap.timeline();
          const duration = 0.05 + Math.random() * 0.1;

          tl.to(ball.dom, {
            y: -(10 + Math.random() * 10),
            ease: 'power1.out',
            duration,
          }).to(ball.dom, {
            y: 0,
            duration,
            ease: 'power1.in'
          });
        });

        setTimeout(() => {
          if (!startedRef.current) {
            showHint();
          }
        }, 2000 * SPEED);
      }
    });
  };

  const init = async () => {
    if (!appRef.current || initialized) return;

    console.log('Initializing...');
    setInitialized(true);

    appRef.current.classList.add('gacha-main');

    const prizeData = await getPrize();
    prizeRef.current = prizeData;

    if (prizeImgRef.current) {
      prizeImgRef.current.src = prizeData.image;
      prizeImgRef.current.onerror = () => {
        console.error('Failed to load prize image:', prizeData.image);
        prizeImgRef.current!.src = 'C:\\Users\\nguye\\Downloads\\logorv.png';
      };
    }
    createBalls();

    if (machineRef.current) {
      gsap.set(machineRef.current, {
        y: '100vh'
      });
    }

    if (titleRef.current) {
      gsap.set(titleRef.current, {
        y: '120vh'
      });
    }

    if (pointerRef.current) {
      gsap.set(pointerRef.current, {
        opacity: 0
      });
    }

    gsap.set('.gacha-prize-reward-container', {
      opacity: 0
    });

    setTimeout(prepare, 500 * SPEED);
  };

  const resetGame = () => {
    setShowPlayAgain(false);
    setInitialized(false);
    setShowPrizeResult(false); // Reset prize result
    prizeShownRef.current = false;

    gsap.killTweensOf('*');

    // Reset all refs
    ballsArrayRef.current = [];
    prizeBallRef.current = null;
    startedRef.current = false;
    prizeRef.current = null;
    jittersRef.current = [];

    // Clean up DOM
    if (appRef.current) {
      appRef.current.classList.remove('gacha-main');
      // Clean up any leftover elements
      const confettiElements = appRef.current.querySelectorAll('.gacha-confetti');
      confettiElements.forEach(el => el.remove());
    }

    // Reset machine display
    if (machineRef.current) {
      machineRef.current.style.display = 'block';
      machineRef.current.style.opacity = '1';
      gsap.set(machineRef.current, { y: '100vh' });
    }

    // Reset prize container
    gsap.set('.gacha-prize-reward-container', {
      opacity: 0,
      zIndex: 1000
    });
    init();
  };

  useEffect(() => {
    if (!showPlayAgain) {
      init();
    }
  }, [showPlayAgain]);

  // Debug: Log trạng thái
  console.log('Render states:', { 
    showPrizeResult, 
    showPlayAgain, 
    initialized,
    prizeShown: prizeShownRef.current 
  });

  return (
    <div className="gacha-app" ref={appRef}>
      <div className="gacha-container">
        <div className="gacha-game-layer">
          <div className="gacha-machine-container" ref={machineRef}>
            <div className="gacha-backboard"></div>
            <div className="gacha-balls" ref={ballsRef}></div>
            <img className="gacha-machine" src="https://assets.codepen.io/2509128/gotcha.svg" alt="Gacha Machine" />
            <div className="gacha-title">
              {TITLE.split('').map((char, index) => (
                <span key={index}>{char}</span>
              ))}
            </div>
            <div className="gacha-price">{PRICE}</div>
            <img
              className="gacha-handle"
              ref={handleRef}
              src="https://assets.codepen.io/2509128/handle.svg"
              alt="Handle"
              style={{ cursor: 'default' }}
            />
            <div className="gacha-pointer" ref={pointerRef}>
              <img src="https://assets.codepen.io/2509128/point.png" alt="Pointer" />
            </div>
          </div>
        </div>
        <div className="gacha-ui-layer">
          <div className="gacha-title-container" ref={titleContainerRef}>
            <div className="gacha-title-wrapper" ref={titleRef}>
              <h2 className="gacha-wiggle">Tap to get a prize!</h2>
            </div>
          </div>
          <div className="gacha-prize-container">
            <div className="gacha-prize-ball-container"></div>
            <div className="gacha-prize-reward-container">
              <div className="gacha-shine">
                <img src="https://assets.codepen.io/2509128/shine.png" alt="Shine" />
              </div>
              <div className="gacha-prize">
                <img className="gacha-wiggle" ref={prizeImgRef} src="" alt="Prize" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play Again Overlay */}
      {showPlayAgain && showPrizeResult && (
        <div className="gacha-play-again-overlay">
          <div className="gacha-play-again-content">
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You got: <strong>{prizeRef.current?.title}</strong></p>
            <button onClick={resetGame} className="gacha-play-again-btn">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GachaMachine;