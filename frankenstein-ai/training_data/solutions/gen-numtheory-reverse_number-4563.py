# Task: gen-numtheory-reverse_number-4563 | Score: 100% | 2026-02-14T13:11:13.488082

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))