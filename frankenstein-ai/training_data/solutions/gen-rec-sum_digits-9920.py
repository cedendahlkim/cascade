# Task: gen-rec-sum_digits-9920 | Score: 100% | 2026-02-13T17:09:17.197820

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)