# Task: gen-ds-reverse_with_stack-1861 | Score: 100% | 2026-02-13T19:48:11.917972

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))