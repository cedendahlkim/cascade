# Task: gen-ds-reverse_with_stack-8723 | Score: 100% | 2026-02-14T12:48:17.090482

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))