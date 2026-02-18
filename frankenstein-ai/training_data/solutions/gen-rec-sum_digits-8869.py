# Task: gen-rec-sum_digits-8869 | Score: 100% | 2026-02-17T20:35:39.579469

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)