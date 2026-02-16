# Task: gen-rec-sum_digits-9874 | Score: 100% | 2026-02-13T11:03:58.611743

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)