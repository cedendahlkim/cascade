# Task: gen-dict-word_length-3816 | Score: 100% | 2026-02-12T20:54:05.581205

text = input()
words = text.split()
word_lengths = {}
for word in words:
    word_lengths[word] = len(word)

sorted_words = sorted(word_lengths.keys())

for word in sorted_words:
    print(word, word_lengths[word])