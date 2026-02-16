# Task: gen-rec-sum_digits-8892 | Score: 100% | 2026-02-13T19:05:32.191406

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)