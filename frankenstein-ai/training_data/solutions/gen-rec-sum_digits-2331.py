# Task: gen-rec-sum_digits-2331 | Score: 100% | 2026-02-14T12:03:04.444986

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)