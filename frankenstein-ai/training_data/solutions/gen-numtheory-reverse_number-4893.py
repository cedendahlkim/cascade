# Task: gen-numtheory-reverse_number-4893 | Score: 100% | 2026-02-15T07:58:50.258848

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))