# Task: gen-strv-longest_word-8520 | Score: 100% | 2026-02-12T17:32:11.742376

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)