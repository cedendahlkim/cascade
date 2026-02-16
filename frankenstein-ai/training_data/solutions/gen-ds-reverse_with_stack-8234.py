# Task: gen-ds-reverse_with_stack-8234 | Score: 100% | 2026-02-14T12:59:27.370109

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))