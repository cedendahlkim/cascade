# Task: gen-dict-word_length-9580 | Score: 100% | 2026-02-12T20:31:19.235712

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))