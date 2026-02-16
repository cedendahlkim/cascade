# Task: gen-ll-reverse_list-6514 | Score: 100% | 2026-02-13T14:18:22.046976

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))