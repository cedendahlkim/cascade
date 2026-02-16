# Task: gen-dict-word_length-7760 | Score: 100% | 2026-02-12T12:19:37.807949

text = input()
words = text.split()
word_lengths = {}
for word in words:
    word_lengths[word] = len(word)

unique_words = sorted(word_lengths.keys())

for word in unique_words:
    print(word, word_lengths[word])