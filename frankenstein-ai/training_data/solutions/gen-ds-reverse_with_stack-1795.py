# Task: gen-ds-reverse_with_stack-1795 | Score: 100% | 2026-02-13T12:52:03.541308

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))