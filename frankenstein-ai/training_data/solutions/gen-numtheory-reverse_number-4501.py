# Task: gen-numtheory-reverse_number-4501 | Score: 100% | 2026-02-13T11:27:24.638354

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))