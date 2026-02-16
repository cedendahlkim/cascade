# Task: gen-rec-sum_digits-3658 | Score: 100% | 2026-02-13T14:56:39.423555

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)