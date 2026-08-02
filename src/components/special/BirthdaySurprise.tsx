import React, { useState, useRef } from 'react';
import { Heart, Gift, Sparkles, Cake, Star, Play, Pause, X, ArrowLeft, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

// Import assets
import photo1 from '@/assets/photo-1.jpeg';
import photo2 from '@/assets/photo-2.jpeg';
import photo3 from '@/assets/photo-3.jpeg';
import photo4 from '@/assets/photo-4.jpeg';
import photo5 from '@/assets/photo-5.jpeg';
import photo6 from '@/assets/photo-6.jpeg';
import photo7 from '@/assets/photo-7.jpeg';
import photo8 from '@/assets/photo-8.jpeg';
import photo9 from '@/assets/photo-9.jpeg';
import selamatUltahAudio from '@/assets/selamatUltah.mp3';

const FLOATING_DECOR = [
  { emoji: '🎈', className: 'top-[8%] left-[5%] text-4xl md:text-6xl animate-float-slow' },
  { emoji: '💖', className: 'top-[20%] right-[7%] text-3xl md:text-5xl animate-float' },
  { emoji: '✨', className: 'top-[6%] right-[28%] text-2xl md:text-4xl animate-twinkle' },
  { emoji: '🎂', className: 'top-[45%] left-[3%] text-3xl md:text-5xl animate-float-delay' },
  { emoji: '🎉', className: 'top-[60%] right-[4%] text-3xl md:text-5xl animate-float-slow' },
  { emoji: '⭐', className: 'top-[30%] left-[14%] text-2xl md:text-4xl animate-twinkle' },
  { emoji: '🌸', className: 'bottom-[18%] left-[22%] text-2xl md:text-4xl animate-float' },
  { emoji: '💝', className: 'bottom-[10%] right-[16%] text-3xl md:text-5xl animate-float-delay' },
];

const WISH_GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-pink-500',
];

interface BirthdaySurpriseProps {
  onReadLetter?: () => void;
  onBack?: () => void;
}

const BirthdaySurprise = ({ onReadLetter, onBack }: BirthdaySurpriseProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Photo details with descriptions and dates
  const photoDetails = [
    {
      description: "Pertemuan pertama setelah jadi PNS",
      date: "Desember 2025",
      title: "Bingxue Pasar Baru"
    },
    {
      description: "Jalan-jalan ke Puncak Bogor",
      date: "Desember 2025",
      title: "Stasiun Bogor"
    },
    {
      description: "Foto Studio di Blok M Square",
      date: "Desember 2025",
      title: "Blok M"
    },
    {
      description: "Bertemu kembali sambil libur lebaran",
      date: "Maret 2026",
      title: "Mal Bintaro Xchange"
    },
    {
      description: "Buka puasa dengan view indah di Solaria Pacific Place",
      date: "Maret 2026",
      title: "Solaria Pacific Place"
    },
    {
      description: "Mudik ke kampung halaman masing-masing",
      date: "Maret 2026",
      title: "Stasiun Gambir"
    },
    {
      description: "Foto sebelum perjalanan ke Pahawang",
      date: "Mei 2026",
      title: "Pelabuhan Ketapang"
    },
    {
      description: "Foto dengan drone di pantai Teluk Hantu, Pahawang",
      date: "Mei 2026",
      title: "Teluk Hantu"
    },
    {
      description: "Kenangan terakhir sebelum kembali ke Jakarta",
      date: "Mei 2026",
      title: "Exit Tol Way Halim"
    }
  ];

  const photos = [photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8, photo9];

  // Confetti celebration on mount
  React.useEffect(() => {
    const end = Date.now() + 1500;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.6 } });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  // Auto-play audio when component mounts with better browser support
  React.useEffect(() => {
    const tryAutoPlay = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.muted = false;
          audioRef.current.volume = 0.7;
          audioRef.current.loop = true;

          // Try to play
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Autoplay failed, user interaction required');
          setIsPlaying(false);

          // Add event listener for first user interaction
          const enableAutoPlay = async () => {
            if (audioRef.current) {
              try {
                await audioRef.current.play();
                setIsPlaying(true);
                document.removeEventListener('click', enableAutoPlay);
                document.removeEventListener('touchstart', enableAutoPlay);
              } catch (e) {
                console.log('Play failed even after user interaction');
              }
            }
          };

          document.addEventListener('click', enableAutoPlay, { once: true });
          document.addEventListener('touchstart', enableAutoPlay, { once: true });
        }
      }
    };

    tryAutoPlay();
  }, []);

  // Pause audio when tab is hidden/minimized, resume when visible again
  React.useEffect(() => {
    let wasPlaying = false;
    const onVisibilityChange = () => {
      if (document.hidden) {
        wasPlaying = !audioRef.current?.paused;
        audioRef.current?.pause();
      } else if (wasPlaying) {
        audioRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-romantic-background via-romantic-muted to-romantic-secondary dark:from-romantic-background dark:via-romantic-muted dark:to-romantic-secondary overflow-hidden">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-600 text-white">
        {/* Animated color blobs */}
        <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-yellow-300/30 blur-3xl animate-pulse"></div>
        <div className="absolute top-8 right-6 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDelay: '0.8s' }}></div>
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl animate-pulse" style={{ animationDelay: '1.6s' }}></div>

        {/* Floating decorations */}
        {FLOATING_DECOR.map((d, i) => (
          <div key={i} className={`absolute ${d.className} select-none pointer-events-none drop-shadow-lg`}>
            {d.emoji}
          </div>
        ))}

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/30"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}

        <div className="relative z-10 px-4 py-14 text-center md:px-6 md:py-20">
          <div className="mb-4 flex justify-center space-x-2 md:mb-6 md:space-x-4">
            <Sparkles className="h-6 w-6 animate-pulse md:h-8 md:w-8" />
            <Heart className="h-6 w-6 animate-bounce text-pink-200 md:h-8 md:w-8" />
            <Cake className="h-6 w-6 animate-pulse md:h-8 md:w-8" />
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight md:mb-4 md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-yellow-200 via-pink-100 to-amber-200 bg-clip-text text-transparent animate-gradient-x">
              Selamat Ulang Tahun
            </span>
          </h1>
          <h2 className="mb-4 text-lg font-light md:mb-6 md:text-2xl lg:text-4xl">
            Sayang ku, Wanda! 💖
          </h2>
          <p className="mx-auto max-w-2xl text-sm opacity-90 md:text-lg">
            Semoga hari spesial ini dipenuhi cinta, kebahagiaan, dan semua hal indah yang kamu impikan, sayang
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 left-2 h-8 w-8 rounded-full bg-pink-300/30 animate-bounce md:-top-4 md:left-4 md:h-16 md:w-16"></div>
        <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-rose-300/30 animate-pulse md:top-8 md:right-8 md:h-12 md:w-12"></div>
        <div className="absolute bottom-2 left-1/4 h-4 w-4 rounded-full bg-pink-400/30 animate-bounce delay-75 md:bottom-4 md:h-8 md:w-8"></div>
        <div className="absolute bottom-4 right-1/3 h-5 w-5 rounded-full bg-rose-400/30 animate-pulse delay-150 md:bottom-8 md:h-10 md:w-10"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Photo Gallery Section */}
        <Card className="mb-8 overflow-hidden border-0 bg-white/80 shadow-xl shadow-rose-200/40 backdrop-blur-sm dark:bg-gray-900/80 md:mb-12">
          <CardContent className="p-4 md:p-8">
            <div className="mb-6 text-center md:mb-8">
              <h3 className="mb-3 flex items-center justify-center text-lg font-bold text-romantic-foreground md:mb-4 md:text-2xl">
                <Star className="mr-2 h-5 w-5 text-romantic-accent md:h-6 md:w-6" />
                Kenangan Indah Kita
                <Star className="ml-2 h-5 w-5 text-romantic-accent md:h-6 md:w-6" />
              </h3>
              <p className="text-sm text-romantic-foreground/70 md:text-base">
                Setiap momen bersamamu adalah harta yang tak ternilai, sayang
              </p>

              {/* Hidden audio element for play/pause control */}
              <div className="sr-only">
                <audio
                  ref={audioRef}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  preload="auto"
                  playsInline
                >
                  <source src={selamatUltahAudio} type="audio/mpeg" />
                  Browser Anda tidak mendukung elemen audio.
                </audio>
              </div>
            </div>

            <div className="grid gap-3 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-romantic-muted to-romantic-secondary shadow-lg cursor-pointer md:cursor-default transition-all duration-300 hover:shadow-xl hover:shadow-rose-300/50 hover:ring-4 hover:ring-pink-400/60"
                  onClick={() => setSelectedPhoto(index)}
                >
                  <img
                    src={photo}
                    alt={`Kenangan indah bersama ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-romantic-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

                  {/* Mobile click indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 md:hidden">
                    <div className="rounded-full bg-white/90 p-2">
                      <Heart className="h-4 w-4 text-romantic-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Birthday Message */}
        <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-romantic-primary/10 via-romantic-accent/10 to-romantic-secondary/20 shadow-xl shadow-rose-200/40 backdrop-blur-sm md:mb-12">
          <CardContent className="p-4 md:p-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center md:mb-6">
                <div className="rounded-full bg-gradient-to-br from-rose-400 to-purple-500 p-3 shadow-lg shadow-rose-300/50">
                  <Cake className="h-8 w-8 text-white md:h-12 md:w-12" />
                </div>
              </div>
              <h3 className="mb-4 text-xl font-bold text-romantic-foreground md:mb-6 md:text-3xl">
                Untuk Cinta Hidupku
              </h3>
              <div className="mx-auto max-w-3xl space-y-3 text-sm text-romantic-foreground/80 md:space-y-4 md:text-lg">
                <p>
                  Sayang, hari ini hatiku dipenuhi rasa syukur karena bisa merayakan hari spesialmu. Senyummu yang hangat, pelukan lembutmu, dan cintamu yang tulus selalu menjadi alasan aku bersemangat setiap hari.
                </p>
                <p>
                  Di hari istimewa ini, aku ingin kamu tahu bahwa kamu adalah hadiah terindah dalam hidupku. Semoga di usia yang baru ini, setiap langkahmu dipenuhi kebahagiaan, setiap mimpimu semakin dekat menjadi kenyataan, dan cinta kita semakin kuat selamanya.
                </p>
                <p className="text-base font-semibold text-romantic-primary md:text-xl">
                  Aku mencintaimu dengan segenap hatiku. Selamat ulang tahun, bidadariku. 💕
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Birthday Wishes Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "Cinta Abadi",
              message: "Semoga cintaku padamu tumbuh semakin dalam setiap hari, dan hatimu selalu dipenuhi kehangatan kasih sayang yang tulus."
            },
            {
              icon: Star,
              title: "Impian Terwujud",
              message: "Aku akan selalu mendukung setiap mimpimu, sayang. Semoga semua yang kamu harapkan menjadi kenyataan indah."
            },
            {
              icon: Gift,
              title: "Kejutan Manis",
              message: "Semoga setiap hari membawa kejutan kecil yang membuatmu tersenyum, seperti cara kamu membuatku bahagia setiap saat."
            },
            {
              icon: Sparkles,
              title: "Momen Berkilau",
              message: "Bersamamu, setiap detik terasa istimewa. Semoga hari ini dan seterusnya penuh dengan momen-momen ajaib kita berdua."
            },
            {
              icon: Cake,
              title: "Perayaan Cinta",
              message: "Hari ini bukan hanya ulang tahunmu, tapi perayaan betapa beruntungnya aku memilikimu dalam hidupku."
            },
            {
              icon: Heart,
              title: "Kebahagiaan Selamanya",
              message: "Aku berjanji akan selalu berusaha membuatmu bahagia, hari ini, besok, dan selamanya."
            }
          ].map((wish, index) => (
            <Card key={index} className="group border-0 bg-white/60 shadow-lg shadow-rose-100/50 backdrop-blur-sm transition-all hover:bg-white/80 hover:scale-[1.03] hover:shadow-xl hover:shadow-rose-200/60 dark:bg-gray-900/60 dark:hover:bg-gray-900/80">
              <CardContent className="p-4 text-center md:p-6">
                <div className="mb-3 flex justify-center md:mb-4">
                  <div className={`rounded-2xl bg-gradient-to-br ${WISH_GRADIENTS[index % WISH_GRADIENTS.length]} p-3 shadow-lg transition-transform group-hover:scale-110`}>
                    <wish.icon className="h-6 w-6 text-white md:h-8 md:w-8" />
                  </div>
                </div>
                <h4 className="mb-2 text-base font-semibold text-romantic-foreground md:mb-3 md:text-lg">
                  {wish.title}
                </h4>
                <p className="text-xs text-romantic-foreground/70 md:text-sm">
                  {wish.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Letter CTA (only when provided, e.g. from SpecialEvent) */}
        {onReadLetter && (
          <div className="mt-8 text-center">
            <Button
              onClick={onReadLetter}
              className="rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-500 px-8 py-3 text-white shadow-lg shadow-rose-300/50 transition-transform hover:scale-105"
            >
              <Mail className="mr-2 h-4 w-4" /> Baca Surat 💌
            </Button>
          </div>
        )}

        {/* Footer Message */}
        <div className="mt-12 text-center md:mt-16">
          <div className="mx-auto max-w-2xl rounded-lg bg-gradient-to-r from-romantic-primary via-romantic-accent to-romantic-gradient-end p-6 text-white shadow-xl shadow-rose-300/50 md:p-8">
            <h3 className="mb-3 text-lg font-bold md:mb-4 md:text-2xl">
              Dengan segenap cinta dalam hatiku 💖
            </h3>
            <p className="text-sm opacity-90 md:text-lg">
              Selamat ulang tahun, cinta hidupku. Semoga Tuhan selalu melindungi dan membahagiakan hidupmu.
            </p>
            <div className="mt-4 flex justify-center space-x-1 md:mt-6 md:space-x-2">
              {[...Array(5)].map((_, i) => (
                <Heart key={i} className="h-5 w-5 animate-pulse text-pink-200 md:h-6 md:w-6" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Photo Modal */}
      {selectedPhoto !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:hidden">
          <div className="relative max-h-full w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Photo */}
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={photos[selectedPhoto]}
                alt={photoDetails[selectedPhoto].title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-romantic-primary">
                  {photoDetails[selectedPhoto].title}
                </h3>
                <span className="text-sm text-romantic-foreground/60">
                  {photoDetails[selectedPhoto].date}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-romantic-foreground/80">
                {photoDetails[selectedPhoto].description}
              </p>

              {/* Decorative hearts */}
              <div className="mt-4 flex justify-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Heart key={i} className="h-4 w-4 animate-pulse text-romantic-accent" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Audio Control Button */}
      <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
        <button
          onClick={toggleAudio}
          className="group relative h-12 w-12 rounded-full bg-gradient-to-r from-romantic-primary via-romantic-accent to-romantic-gradient-end shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-romantic-primary/50 md:h-16 md:w-16"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
          <div className="flex h-full w-full items-center justify-center">
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white md:h-6 md:w-6" />
            ) : (
              <Play className="h-5 w-5 text-white translate-x-0.5 md:h-6 md:w-6" />
            )}
          </div>

          {/* Pulse animation when playing */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-romantic-primary via-romantic-accent to-romantic-gradient-end animate-ping opacity-30"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default BirthdaySurprise;
