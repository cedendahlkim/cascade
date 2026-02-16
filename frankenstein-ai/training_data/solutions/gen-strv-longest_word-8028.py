# Task: gen-strv-longest_word-8028 | Score: 100% | 2026-02-12T13:28:53.376220

words = input().split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)