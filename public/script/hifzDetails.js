const hdfVersesNumBtn = document.querySelector('#hdf-verses-num-btn');
const sectionSurahVerses = document.querySelector('.S-surah-verses');

hdfVersesNumBtn.addEventListener('mouseover', () => {
  sectionSurahVerses.classList.remove('S-surah-verses-hidden');
});
hdfVersesNumBtn.addEventListener('mouseout', () => {
  sectionSurahVerses.classList.add('S-surah-verses-hidden');
});
