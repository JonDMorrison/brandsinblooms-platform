'use client'

import { Card } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { MapPin, Users, Award, Heart } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'
import { TeamMemberPhoto, LocationImage } from '@/src/components/ui/plant-shop-image'
import { SiteThemeProvider, ThemeWrapper, useSiteThemeContext } from '@/src/components/theme/ThemeProvider'

interface AboutCompanyPreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

function AboutCompanyPreviewContent({ title, subtitle, content, onContentUpdate, onFeatureUpdate }: AboutCompanyPreviewProps) {
  const { theme } = useSiteThemeContext()

  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)

  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'about')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)

    return (
      <div
        className={`w-full h-full ${spacingClass}`}
        style={{
          backgroundColor: 'var(--theme-background, #FFFFFF)'
        }}>
        {sections.map(({ key, section }) => (
          <DynamicSection
            key={key}
            section={section}
            sectionKey={key}
            className=""
            onContentUpdate={onContentUpdate}
            onFeatureUpdate={onFeatureUpdate}
          />
        ))}
      </div>
    )
  }
  
  // Fallback to legacy format or convert legacy content
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    return (
      <div
        className="w-full min-h-full p-6 space-y-8"
        style={{
          backgroundColor: 'var(--theme-background, #FFFFFF)'
        }}>
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1
            className="text-3xl font-bold"
            style={{
              color: 'var(--theme-text, #1F2937)',
              fontFamily: 'var(--theme-font-heading, inherit)'
            }}>{legacyTitle}</h1>
          {legacySubtitle && (
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{
                color: 'var(--theme-text-secondary, #6B7280)',
                fontFamily: 'var(--theme-font-body, inherit)'
              }}>{legacySubtitle}</p>
          )}
        </div>

        {/* Company Story */}
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h2
              className="text-2xl font-bold"
              style={{
                color: 'var(--theme-text, #1F2937)',
                fontFamily: 'var(--theme-font-heading, inherit)'
              }}>Our Story</h2>
            <p
              className="leading-relaxed"
              style={{
                color: 'var(--theme-text-secondary, #6B7280)',
                fontFamily: 'var(--theme-font-body, inherit)'
              }}>
              {content && 'content' in content && content.content
                ? content.content
                : 'Tell your company story here. Share your journey, mission, and what makes your business unique. Use the content editor to add rich text, images, and formatting to create an engaging about page.'
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: 'var(--theme-primary, #3B82F6)',
                    fontFamily: 'var(--theme-font-heading, inherit)'
                  }}>500+</div>
                <div
                  className="text-sm"
                  style={{
                    color: 'var(--theme-text-secondary, #6B7280)',
                    fontFamily: 'var(--theme-font-body, inherit)'
                  }}>Happy Customers</div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: 'var(--theme-secondary, #10B981)',
                    fontFamily: 'var(--theme-font-heading, inherit)'
                  }}>10+</div>
                <div
                  className="text-sm"
                  style={{
                    color: 'var(--theme-text-secondary, #6B7280)',
                    fontFamily: 'var(--theme-font-body, inherit)'
                  }}>Years Experience</div>
              </div>
            </div>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <LocationImage
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80"
              alt="Plant shop interior with beautiful plants and natural lighting"
              locationName="Plant Shop Interior"
              width={800}
              height={450}
              className="w-full min-h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Values */}
        <div>
          <h2
            className="text-2xl font-bold text-center mb-6"
            style={{
              color: 'var(--theme-text, #1F2937)',
              fontFamily: 'var(--theme-font-heading, inherit)'
            }}>Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: 'Passion', desc: 'Love for what we do' },
              { icon: Award, title: 'Quality', desc: 'Excellence in every detail' },
              { icon: Users, title: 'Community', desc: 'Supporting local connections' }
            ].map((value, i) => {
              const Icon = value.icon
              return (
                <Card
                  key={i}
                  className="p-4 text-center border"
                  style={{
                    backgroundColor: 'var(--theme-background, #FFFFFF)',
                    borderColor: 'var(--theme-border, #E5E7EB)'
                  }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{
                      backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)'
                    }}>
                    <Icon
                      className="h-6 w-6"
                      style={{
                        color: 'var(--theme-primary, #3B82F6)'
                      }} />
                  </div>
                  <h3
                    className="font-semibold mb-2"
                    style={{
                      color: 'var(--theme-text, #1F2937)',
                      fontFamily: 'var(--theme-font-heading, inherit)'
                    }}>{value.title}</h3>
                  <p
                    className="text-sm"
                    style={{
                      color: 'var(--theme-text-secondary, #6B7280)',
                      fontFamily: 'var(--theme-font-body, inherit)'
                    }}>{value.desc}</p>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Team Section */}
        <div>
          <h2
            className="text-2xl font-bold text-center mb-6"
            style={{
              color: 'var(--theme-text, #1F2937)',
              fontFamily: 'var(--theme-font-heading, inherit)'
            }}>Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Green',
                role: 'Plant Care Specialist',
                bio: 'With 8 years of experience, Sarah helps customers find the perfect plants for their homes.',
                imageSrc: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=200&q=80'
              },
              {
                name: 'Mike Thompson',
                role: 'Store Manager',
                bio: 'Mike oversees daily operations and ensures every customer has a wonderful experience.',
                imageSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
              },
              {
                name: 'Emma Rodriguez',
                role: 'Landscape Designer',
                bio: 'Emma creates beautiful outdoor spaces and provides expert gardening consultations.',
                imageSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80'
              }
            ].map((member, i) => (
              <Card
                key={i}
                className="p-4 text-center hover:shadow-lg transition-shadow border"
                style={{
                  backgroundColor: 'var(--theme-background, #FFFFFF)',
                  borderColor: 'var(--theme-border, #E5E7EB)'
                }}>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                  <TeamMemberPhoto
                    src={member.imageSrc}
                    alt={`${member.name}, ${member.role} at the plant shop`}
                    personName={member.name}
                    width={80}
                    height={80}
                    className="w-full min-h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <h3
                  className="font-semibold mb-1"
                  style={{
                    color: 'var(--theme-text, #1F2937)',
                    fontFamily: 'var(--theme-font-heading, inherit)'
                  }}>{member.name}</h3>
                <Badge
                  variant="outline"
                  className="mb-3 border"
                  style={{
                    color: 'var(--theme-secondary, #10B981)',
                    borderColor: 'var(--theme-secondary, #10B981)'
                  }}>
                  {member.role}
                </Badge>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: 'var(--theme-text-secondary, #6B7280)',
                    fontFamily: 'var(--theme-font-body, inherit)'
                  }}>
                  {member.bio}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Location */}
        <div
          className="text-center rounded-lg p-6"
          style={{
            backgroundColor: 'var(--theme-muted, #F9FAFB)'
          }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin
              className="h-5 w-5"
              style={{
                color: 'var(--theme-primary, #3B82F6)'
              }} />
            <h3
              className="font-semibold"
              style={{
                color: 'var(--theme-text, #1F2937)',
                fontFamily: 'var(--theme-font-heading, inherit)'
              }}>Visit Us</h3>
          </div>
          <p
            style={{
              color: 'var(--theme-text-secondary, #6B7280)',
              fontFamily: 'var(--theme-font-body, inherit)'
            }}>Add your business address here</p>
          <p
            className="text-sm mt-1"
            style={{
              color: 'var(--theme-text-secondary, #6B7280)',
              fontFamily: 'var(--theme-font-body, inherit)'
            }}>Include your hours of operation</p>
        </div>
      </div>
    )
  }

  // Empty state
  return (
    <div
      className="w-full min-h-full p-6 flex items-center justify-center"
      style={{
        backgroundColor: 'var(--theme-background, #FFFFFF)'
      }}>
      <div
        className="text-center"
        style={{
          color: 'var(--theme-text-muted, #9CA3AF)'
        }}>
        <h3
          className="text-xl font-semibold mb-2"
          style={{
            color: 'var(--theme-text, #1F2937)',
            fontFamily: 'var(--theme-font-heading, inherit)'
          }}>About Company Preview</h3>
        <p
          style={{
            fontFamily: 'var(--theme-font-body, inherit)'
          }}>Add content to see your about page design</p>
      </div>
    </div>
  )
}

export function AboutCompanyPreview(props: AboutCompanyPreviewProps) {
  return (
    <SiteThemeProvider>
      <ThemeWrapper className="w-full min-h-full">
        <AboutCompanyPreviewContent {...props} />
      </ThemeWrapper>
    </SiteThemeProvider>
  )
}