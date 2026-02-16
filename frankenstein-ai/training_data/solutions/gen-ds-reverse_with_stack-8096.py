# Task: gen-ds-reverse_with_stack-8096 | Score: 100% | 2026-02-13T17:35:45.157205

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))