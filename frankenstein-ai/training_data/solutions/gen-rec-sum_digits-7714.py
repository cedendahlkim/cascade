# Task: gen-rec-sum_digits-7714 | Score: 100% | 2026-02-15T10:29:07.639812

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)