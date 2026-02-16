# Task: gen-ll-reverse_list-8336 | Score: 100% | 2026-02-13T12:23:22.570338

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))