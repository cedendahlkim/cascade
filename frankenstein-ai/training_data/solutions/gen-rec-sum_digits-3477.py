# Task: gen-rec-sum_digits-3477 | Score: 100% | 2026-02-15T13:59:52.335029

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)