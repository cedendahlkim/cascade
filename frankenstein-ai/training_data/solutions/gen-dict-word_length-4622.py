# Task: gen-dict-word_length-4622 | Score: 100% | 2026-02-12T20:29:44.615091

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))