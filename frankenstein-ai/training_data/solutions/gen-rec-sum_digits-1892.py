# Task: gen-rec-sum_digits-1892 | Score: 100% | 2026-02-13T14:30:11.374287

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)