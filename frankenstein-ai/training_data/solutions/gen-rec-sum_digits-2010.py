# Task: gen-rec-sum_digits-2010 | Score: 100% | 2026-02-13T13:11:38.725522

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)