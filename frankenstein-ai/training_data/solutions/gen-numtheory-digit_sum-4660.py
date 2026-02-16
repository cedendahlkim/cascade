# Task: gen-numtheory-digit_sum-4660 | Score: 100% | 2026-02-12T12:11:08.352166

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)