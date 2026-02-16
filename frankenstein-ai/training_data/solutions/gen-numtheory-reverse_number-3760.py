# Task: gen-numtheory-reverse_number-3760 | Score: 100% | 2026-02-15T09:16:37.188953

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))