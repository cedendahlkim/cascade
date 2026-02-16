# Task: gen-rec-sum_digits-3814 | Score: 100% | 2026-02-13T11:09:07.318792

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)