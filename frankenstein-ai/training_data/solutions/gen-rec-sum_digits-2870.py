# Task: gen-rec-sum_digits-2870 | Score: 100% | 2026-02-17T20:09:06.945731

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)