# Task: gen-dict-word_length-3476 | Score: 100% | 2026-02-10T15:41:53.194990

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))