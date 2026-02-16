# Task: gen-rec-sum_digits-8847 | Score: 100% | 2026-02-13T10:39:38.809068

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)