# Task: gen-ll-reverse_list-6468 | Score: 100% | 2026-02-13T17:35:33.981311

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))