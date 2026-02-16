# Task: gen-ll-reverse_list-1986 | Score: 100% | 2026-02-13T14:18:35.713715

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))