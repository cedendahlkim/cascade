# Task: gen-dict-word_length-3632 | Score: 100% | 2026-02-12T12:10:53.415870

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))