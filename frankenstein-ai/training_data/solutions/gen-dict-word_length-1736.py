# Task: gen-dict-word_length-1736 | Score: 100% | 2026-02-12T19:50:20.762609

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))