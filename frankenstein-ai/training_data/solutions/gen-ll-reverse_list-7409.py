# Task: gen-ll-reverse_list-7409 | Score: 100% | 2026-02-14T12:28:31.718706

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))