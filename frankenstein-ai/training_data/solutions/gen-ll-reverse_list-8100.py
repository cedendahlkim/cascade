# Task: gen-ll-reverse_list-8100 | Score: 100% | 2026-02-13T13:43:04.397302

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))