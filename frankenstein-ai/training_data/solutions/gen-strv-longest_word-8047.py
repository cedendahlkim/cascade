# Task: gen-strv-longest_word-8047 | Score: 100% | 2026-02-12T11:59:46.198838

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)