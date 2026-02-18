# Task: gen-rec-sum_digits-6650 | Score: 100% | 2026-02-17T20:35:38.069590

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)