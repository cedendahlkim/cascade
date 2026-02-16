# Task: gen-rec-sum_digits-4085 | Score: 100% | 2026-02-14T12:46:57.468544

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)