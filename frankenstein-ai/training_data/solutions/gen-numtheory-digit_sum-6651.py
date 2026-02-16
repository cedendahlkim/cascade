# Task: gen-numtheory-digit_sum-6651 | Score: 100% | 2026-02-12T12:18:10.485455

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)