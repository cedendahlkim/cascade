# Task: gen-dict-word_length-1952 | Score: 100% | 2026-02-12T13:20:26.716148

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))