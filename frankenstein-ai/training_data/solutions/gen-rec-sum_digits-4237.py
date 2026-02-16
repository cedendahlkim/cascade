# Task: gen-rec-sum_digits-4237 | Score: 100% | 2026-02-13T10:03:03.129210

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)