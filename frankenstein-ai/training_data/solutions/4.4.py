# Task: 4.4 | Score: 100% | 2026-02-13T18:31:40.168599

text = input()
words = text.split()
word_counts = {}
for word in words:
    if word in word_counts:
        word_counts[word] += 1
    else:
        word_counts[word] = 1

sorted_words = sorted(word_counts.keys())

for word in sorted_words:
    print(word, word_counts[word])